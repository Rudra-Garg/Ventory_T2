from firebase_admin import credentials, firestore, storage, initialize_app

cred = (credentials.
        Certificate("C:/Users/Rudra Garg/Downloads/Ventory/ventory-t2-firebase-adminsdk-qxd2q-164cb8f375.json"))
initialize_app(cred, {
    'projectId': 'ventory-t2',
    'storageBucket': 'ventory-t2.appspot.com',
    'database': '(default)'

})

db = firestore.client()
bucket = storage.bucket()
