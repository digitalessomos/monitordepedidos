import { auth } from '../config/firebase.config.js';
import { signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

export const authService = {
    async loginAnonymously() {
        try {
            return await signInAnonymously(auth);
        } catch (error) {
            console.error("Auth Error:", error);
            throw error;
        }
    },

    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    },

    async logout() {
        return await signOut(auth);
    },

    getCurrentUser() {
        return auth.currentUser;
    }
};
