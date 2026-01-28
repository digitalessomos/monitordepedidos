import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAC0K_7GdPfZ1idnpa0VkwgZ9zBYOB4PRk",
    authDomain: "crudfbtest.firebaseapp.com",
    projectId: "crudfbtest",
    storageBucket: "crudfbtest.firebasestorage.app",
    messagingSenderId: "171088113288",
    appId: "1:171088113288:web:eb8b6e333edce9be90b93d"
};

class FirebaseService {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.appId = 'logistica-pro-360';
    }

    async init() {
        try {
            await signInAnonymously(this.auth);
        } catch (error) {
            console.error("Firebase Auth Error:", error);
            throw error;
        }
    }

    onAuthChange(callback) {
        onAuthStateChanged(this.auth, callback);
    }

    subscribeToOrders(callback) {
        const ordersRef = collection(this.db, 'artifacts', this.appId, 'public', 'data', 'orders');
        return onSnapshot(ordersRef, (snapshot) => {
            const orders = {};
            snapshot.forEach(doc => {
                orders[doc.id] = doc.data();
            });
            callback(orders);
        }, (error) => console.error("Orders Listener Error:", error));
    }

    subscribeToStaff(callback) {
        const configRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'config', 'staff');
        return onSnapshot(configRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data().list || []);
            } else {
                const defaultStaff = ['Carlos M.', 'Ana R.', 'Mateo G.'];
                setDoc(configRef, { list: defaultStaff });
                callback(defaultStaff);
            }
        }, (error) => console.error("Staff Listener Error:", error));
    }

    async createOrder(id, repartidor = null) {
        const orderRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'orders', id.toString());
        const newOrder = {
            id: parseInt(id),
            repartidor: repartidor || null,
            status: repartidor ? 'en ruta' : 'nuevo',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            serverTime: serverTimestamp()
        };
        await setDoc(orderRef, newOrder);
    }

    async assignOrder(id, repartidor) {
        const orderRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            repartidor: repartidor || null,
            status: repartidor ? 'en ruta' : 'nuevo',
            timestamp: Date.now()
        });
    }

    async finalizeOrder(id) {
        const orderRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            status: 'entregado',
            timestamp: Date.now()
        });
    }

    async deleteOrder(id) {
        const orderRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'orders', id.toString());
        await deleteDoc(orderRef);
    }

    async updateStaff(newList) {
        const configRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'config', 'staff');
        await setDoc(configRef, { list: newList });
    }

    async logout() {
        await signOut(this.auth);
    }
}

export const firebaseService = new FirebaseService();
