const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_STORAGE_BUCKET'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.warn(`⚠️  Firebase initialization skipped. Missing environment variables: ${missingVars.join(', ')}`);
        console.warn('🔥 Firebase functions will not work until these variables are set.');
        return;
      }

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

      console.log('🔥 Firebase Admin initialized successfully');
      console.log(`📁 Storage bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
    } else {
      console.log('🔥 Firebase Admin already initialized');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    console.warn('🔥 Firebase functions will not work until this issue is resolved.');
  }
};

const getStorage = () => {
  return admin.storage();
};

const getBucket = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin is not initialized. Please check your Firebase configuration.');
  }
  return admin.storage().bucket();
};

// Upload avatar to Firebase Storage
const uploadAvatar = async (fileBuffer, fileName, userId) => {
  try {
    const bucket = getBucket();
    const file = bucket.file(`avatars/${userId}/${fileName}`);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/jpeg'
      },
      public: true,
      validation: 'md5'
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make the file public
          await file.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          reject(error);
        }
      });

      stream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw error;
  }
};

// Upload image from base64 or buffer to Firebase Storage
const uploadImageToFirebase = async (imageData, folder, filename) => {
  try {
    const bucket = getBucket();
    let buffer;
    let contentType = 'image/jpeg';

    // Check if imageData is base64 string
    if (typeof imageData === 'string') {
      // Remove data:image/xxx;base64, prefix if exists
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      
      // Detect content type from base64 prefix
      const matches = imageData.match(/^data:image\/(\w+);base64,/);
      if (matches && matches[1]) {
        contentType = `image/${matches[1]}`;
      }
    } else if (Buffer.isBuffer(imageData)) {
      buffer = imageData;
    } else {
      throw new Error('Invalid image data format');
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${filename || 'image.jpg'}`;
    const file = bucket.file(`${folder}/${fileName}`);

    const stream = file.createWriteStream({
      metadata: {
        contentType: contentType
      },
      public: true,
      validation: 'md5'
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          await file.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          reject(error);
        }
      });

      stream.end(buffer);
    });
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw error;
  }
};

// Delete avatar from Firebase Storage
const deleteAvatar = async (userId, fileName) => {
  try {
    const bucket = getBucket();
    const file = bucket.file(`avatars/${userId}/${fileName}`);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Avatar deleted: avatars/${userId}/${fileName}`);
      return true;
    } else {
      console.log(`Avatar not found: avatars/${userId}/${fileName}`);
      return false;
    }
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw error;
  }
};

// Delete all avatars for a user
const deleteUserAvatars = async (userId) => {
  try {
    const bucket = getBucket();
    const [files] = await bucket.getFiles({
      prefix: `avatars/${userId}/`
    });

    if (files.length === 0) {
      console.log(`No avatars found for user: ${userId}`);
      return true;
    }

    const deletePromises = files.map(file => file.delete());
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${files.length} avatar files for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Firebase delete user avatars error:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getStorage,
  getBucket,
  uploadAvatar,
  uploadImageToFirebase,
  deleteAvatar,
  deleteUserAvatars,
  admin
}; 