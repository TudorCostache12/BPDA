#![no_std]

use multiversx_sc::imports::*;
use multiversx_sc::derive_imports::*;

/// Structure for storing information about a registered document
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem)]
pub struct DocumentInfo<M: ManagedTypeApi> {
    pub owner: ManagedAddress<M>,
    pub timestamp: u64,
    pub is_revoked: bool,
}

/// Smart Contract for decentralized document verification
/// Allows registration, verification, and revocation of document hashes
#[multiversx_sc::contract]
pub trait DocumentVerification {
    
    /// Initializes the contract
    #[init]
    fn init(&self) {}

    /// Upgrade contract
    #[upgrade]
    fn upgrade(&self) {}

    // ============= STORAGE =============
    
    /// Mapping: document hash -> document info
    #[storage_mapper("documentRegistry")]
    fn document_registry(&self, hash: &ManagedBuffer) -> SingleValueMapper<DocumentInfo<Self::Api>>;

    /// List of all hashes registered by a user
    #[storage_mapper("userDocuments")]
    fn user_documents(&self, user: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    /// Total registered documents counter
    #[storage_mapper("totalDocuments")]
    fn total_documents(&self) -> SingleValueMapper<u64>;

    // ============= ENDPOINTS =============

    /// Registers a document hash on the blockchain
    /// @param document_hash - SHA-256 Hash of the document (in hex format)
    #[endpoint(registerDocument)]
    fn register_document(&self, document_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let timestamp = self.blockchain().get_block_timestamp();

        // Check if hash is valid (32 bytes for SHA-256)
        require!(
            document_hash.len() == 32,
            "Invalid hash: must be a SHA-256 hash (32 bytes)"
        );

        // Check if document is not already registered
        require!(
            self.document_registry(&document_hash).is_empty(),
            "Document is already registered"
        );

        // Create document record
        let doc_info = DocumentInfo {
            owner: caller.clone(),
            timestamp,
            is_revoked: false,
        };

        // Save to storage
        self.document_registry(&document_hash).set(&doc_info);
        self.user_documents(&caller).insert(document_hash.clone());
        
        // Increment counter
        let total = self.total_documents().get();
        self.total_documents().set(total + 1);

        // Emit event
        self.document_registered_event(&caller, &document_hash, timestamp);
    }

    /// Checks if a document is registered and returns the information
    /// @param document_hash - Hash of the document to verify
    #[view(verifyDocument)]
    fn verify_document(&self, document_hash: ManagedBuffer) -> MultiValue4<bool, ManagedAddress, u64, bool> {
        if self.document_registry(&document_hash).is_empty() {
            // Document does not exist
            return (false, ManagedAddress::zero(), 0u64, false).into();
        }

        let doc_info = self.document_registry(&document_hash).get();
        (true, doc_info.owner, doc_info.timestamp, doc_info.is_revoked).into()
    }

    /// Revokes a document (only the owner can do this)
    /// @param document_hash - Hash of the document to revoke
    #[endpoint(revokeDocument)]
    fn revoke_document(&self, document_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();

        // Check if document exists
        require!(
            !self.document_registry(&document_hash).is_empty(),
            "Document is not registered"
        );

        let mut doc_info = self.document_registry(&document_hash).get();

        // Check if caller is the owner
        require!(
            doc_info.owner == caller,
            "Only the owner can revoke the document"
        );

        // Check if not already revoked
        require!(
            !doc_info.is_revoked,
            "Document is already revoked"
        );

        // Mark as revoked
        doc_info.is_revoked = true;
        self.document_registry(&document_hash).set(&doc_info);

        // Emit event
        self.document_revoked_event(&caller, &document_hash);
    }

    /// Returns all documents registered by a user
    #[view(getUserDocuments)]
    fn get_user_documents(&self, user: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for hash in self.user_documents(&user).iter() {
            result.push(hash);
        }
        result
    }

    /// Returns the total number of registered documents
    #[view(getTotalDocuments)]
    fn get_total_documents(&self) -> u64 {
        self.total_documents().get()
    }

    // ============= EVENTS =============

    /// Event emitted when a document is registered
    #[event("documentRegistered")]
    fn document_registered_event(
        &self,
        #[indexed] owner: &ManagedAddress,
        #[indexed] document_hash: &ManagedBuffer,
        timestamp: u64,
    );

    /// Event emitted when a document is revoked
    #[event("documentRevoked")]
    fn document_revoked_event(
        &self,
        #[indexed] owner: &ManagedAddress,
        #[indexed] document_hash: &ManagedBuffer,
    );
}
