/**
 * Google Drive Backup Service
 * This service handles backing up and restoring data to/from Google Drive
 */

// Function to check if the user has a valid Google Drive access token
export const hasValidGoogleDriveToken = (): boolean => {
  const token = localStorage.getItem('google_drive_token');
  return !!token;
};

// Helper function to handle auth errors more gracefully
const handleAuthErrors = (error: any): void => {
  if (error && error.status === 401) {
    // Token expired or invalid, clear it
    localStorage.removeItem('google_drive_token');
    throw new Error('Your Google Drive session has expired. Please sign in again.');
  }
  
  if (error && error.message && error.message.includes('authorized')) {
    throw new Error('Firebase authentication failed. Please ensure you have added your domain to the authorized domains list in Firebase console.');
  }
  
  throw error;
};

// Function to backup data to Google Drive
export const backupToDrive = async (data: any, fileName: string = 'cafe_pos_backup.json'): Promise<boolean> => {
  try {
    const token = localStorage.getItem('google_drive_token');
    if (!token) {
      throw new Error('No Google Drive access token found. Please sign in with Google first.');
    }

    console.log("Starting Google Drive backup with token:", token.substring(0, 10) + "...");

    // Create a file metadata object
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    // Create the file content as a Blob
    const contentBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    // Try a different approach for uploading
    try {
      // First create an empty file to get an ID
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error("Failed to create file:", errorData);
        throw new Error(`Failed to create file: ${errorData.error?.message || 'Unknown error'}`);
      }

      const { id } = await createResponse.json();
      console.log("File created with ID:", id);

      // Then upload the content to that file
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Failed to upload content:", errorData);
        throw new Error(`Failed to upload content: ${errorData.error?.message || 'Unknown error'}`);
      }

      console.log("Backup completed successfully");
      return true;
    } catch (uploadError) {
      console.error("Error with two-step upload:", uploadError);
      
      // Fall back to the multipart upload method if two-step fails
      console.log("Trying multipart upload as fallback...");
      
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', contentBlob);

      // Upload the file to Google Drive
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload backup: ${errorData.error?.message || 'Unknown error'}`);
      }

      console.log("Fallback multipart upload successful");
      return true;
    }
  } catch (error) {
    console.error('Error backing up to Google Drive:', error);
    throw error;
  }
};

// Function to fetch backups from Google Drive
export const fetchBackupsFromDrive = async (): Promise<any[]> => {
  try {
    const token = localStorage.getItem('google_drive_token');
    if (!token) {
      throw new Error('No Google Drive access token found. Please sign in with Google first.');
    }

    // Search for JSON files created by the app
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/json%27&fields=files(id,name,createdTime,modifiedTime)',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch backups: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching backups from Google Drive:', error);
    throw error;
  }
};

// Function to restore data from a Google Drive backup file
export const restoreFromDrive = async (fileId: string): Promise<any> => {
  try {
    const token = localStorage.getItem('google_drive_token');
    if (!token) {
      throw new Error('No Google Drive access token found. Please sign in with Google first.');
    }

    // Download the file content
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to download backup: ${errorData.error?.message || 'Unknown error'}`);
    }

    const backupData = await response.json();
    return backupData;
  } catch (error) {
    console.error('Error restoring from Google Drive:', error);
    throw error;
  }
};