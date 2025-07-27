// src/components/FileUpload.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `profiles/${Date.now()}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('profile-pictures') // Your Supabase Storage Bucket name
        .upload(filePath, file);

      if (error) {
        console.error('File upload error:', error.message);
        alert('File upload failed');
        setIsUploading(false);
        return;
      }

      const { publicURL, error: urlError } = supabase
        .storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('URL retrieval error:', urlError.message);
        alert('Failed to retrieve file URL');
        setIsUploading(false);
        return;
      }

      // Call onUploadSuccess with the public URL of the uploaded file
      onUploadSuccess(publicURL);

    } catch (err) {
      console.error('Error during upload:', err);
      alert('Error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;