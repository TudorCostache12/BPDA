#![no_std]

use multiversx_sc::imports::*;
use multiversx_sc::derive_imports::*;

/// Structură pentru stocarea informațiilor despre un document înregistrat
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem)]
pub struct DocumentInfo<M: ManagedTypeApi> {
    pub owner: ManagedAddress<M>,
    pub timestamp: u64,
    pub is_revoked: bool,
}

/// Smart Contract pentru verificarea decentralizată a documentelor
/// Permite înregistrarea, verificarea și revocarea hash-urilor de documente
#[multiversx_sc::contract]
pub trait DocumentVerification {
    
    /// Inițializează contractul
    #[init]
    fn init(&self) {}

    /// Upgrade contract
    #[upgrade]
    fn upgrade(&self) {}

    // ============= STORAGE =============
    
    /// Mapare: hash document -> informații document
    #[storage_mapper("documentRegistry")]
    fn document_registry(&self, hash: &ManagedBuffer) -> SingleValueMapper<DocumentInfo<Self::Api>>;

    /// Lista tuturor hash-urilor înregistrate de un utilizator
    #[storage_mapper("userDocuments")]
    fn user_documents(&self, user: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    /// Contor total documente înregistrate
    #[storage_mapper("totalDocuments")]
    fn total_documents(&self) -> SingleValueMapper<u64>;

    // ============= ENDPOINTS =============

    /// Înregistrează un hash de document pe blockchain
    /// @param document_hash - Hash-ul SHA-256 al documentului (în format hex)
    #[endpoint(registerDocument)]
    fn register_document(&self, document_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let timestamp = self.blockchain().get_block_timestamp();

        // Verifică dacă hash-ul este valid (32 bytes pentru SHA-256)
        require!(
            document_hash.len() == 32,
            "Hash invalid: trebuie sa fie un hash SHA-256 (32 bytes)"
        );

        // Verifică dacă documentul nu este deja înregistrat
        require!(
            self.document_registry(&document_hash).is_empty(),
            "Documentul este deja inregistrat"
        );

        // Creează înregistrarea documentului
        let doc_info = DocumentInfo {
            owner: caller.clone(),
            timestamp,
            is_revoked: false,
        };

        // Salvează în storage
        self.document_registry(&document_hash).set(&doc_info);
        self.user_documents(&caller).insert(document_hash.clone());
        
        // Incrementează contorul
        let total = self.total_documents().get();
        self.total_documents().set(total + 1);

        // Emite evenimentul
        self.document_registered_event(&caller, &document_hash, timestamp);
    }

    /// Verifică dacă un document este înregistrat și returnează informațiile
    /// @param document_hash - Hash-ul documentului de verificat
    #[view(verifyDocument)]
    fn verify_document(&self, document_hash: ManagedBuffer) -> MultiValue4<bool, ManagedAddress, u64, bool> {
        if self.document_registry(&document_hash).is_empty() {
            // Documentul nu există
            return (false, ManagedAddress::zero(), 0u64, false).into();
        }

        let doc_info = self.document_registry(&document_hash).get();
        (true, doc_info.owner, doc_info.timestamp, doc_info.is_revoked).into()
    }

    /// Revocă un document (doar proprietarul poate face asta)
    /// @param document_hash - Hash-ul documentului de revocat
    #[endpoint(revokeDocument)]
    fn revoke_document(&self, document_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();

        // Verifică dacă documentul există
        require!(
            !self.document_registry(&document_hash).is_empty(),
            "Documentul nu este înregistrat"
        );

        let mut doc_info = self.document_registry(&document_hash).get();

        // Verifică dacă caller-ul este proprietarul
        require!(
            doc_info.owner == caller,
            "Doar proprietarul poate revoca documentul"
        );

        // Verifică dacă nu este deja revocat
        require!(
            !doc_info.is_revoked,
            "Documentul este deja revocat"
        );

        // Marchează ca revocat
        doc_info.is_revoked = true;
        self.document_registry(&document_hash).set(&doc_info);

        // Emite evenimentul
        self.document_revoked_event(&caller, &document_hash);
    }

    /// Returnează toate documentele înregistrate de un utilizator
    #[view(getUserDocuments)]
    fn get_user_documents(&self, user: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for hash in self.user_documents(&user).iter() {
            result.push(hash);
        }
        result
    }

    /// Returnează numărul total de documente înregistrate
    #[view(getTotalDocuments)]
    fn get_total_documents(&self) -> u64 {
        self.total_documents().get()
    }

    // ============= EVENTS =============

    /// Eveniment emis când un document este înregistrat
    #[event("documentRegistered")]
    fn document_registered_event(
        &self,
        #[indexed] owner: &ManagedAddress,
        #[indexed] document_hash: &ManagedBuffer,
        timestamp: u64,
    );

    /// Eveniment emis când un document este revocat
    #[event("documentRevoked")]
    fn document_revoked_event(
        &self,
        #[indexed] owner: &ManagedAddress,
        #[indexed] document_hash: &ManagedBuffer,
    );
}
