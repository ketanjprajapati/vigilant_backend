const admin = require('firebase-admin');
const serviceAccount = require('./service_account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const db = admin.firestore();

app.post('/send-notification', async (req, res) => {
    const { email, title, body } = req.body;

    try {
        let snapshot=await db.collection('users').where('email', '==', email).get();
        
        if (snapshot.empty) {
            res.status(404).send('No matching documents.');
            return;
        }
        
        let userData;
        snapshot.forEach(doc => {
            userData = doc.data() ;
        });

        if (!userData || !userData.fcmToken) {
            res.status(404).send('User not found or user does not have a token.');
            return;
        }

        const message = {
            notification: {
                title: String(title),
                body: String(body),    
            },
            data:{
                screen:"Warning"
            },
            token: userData.fcmToken,
        };
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error finding user by email and sending notification:', error);
        res.status(500).send('Error finding user and sending notification');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});