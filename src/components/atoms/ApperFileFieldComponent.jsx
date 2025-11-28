import { useEffect, useRef, useState, useMemo } from 'react';

const ApperFileFieldComponent = ({ config, elementId }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementId ref when it changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoized existingFiles to prevent re-renders & detect actual changes
  const memoizedExistingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // If length changed or first file ID changed, it's a different set
    if (config.existingFiles.length === 0) return [];
    
    const firstFileId = config.existingFiles[0]?.Id || config.existingFiles[0]?.id;
    return firstFileId ? config.existingFiles : [];
  }, [config.existingFiles?.length, config.existingFiles?.[0]?.Id || config.existingFiles?.[0]?.id]);

  // Initial Mount Effect
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Wait for ApperSDK to load (50 attempts × 100ms = 5 seconds max)
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.ApperSDK && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }

        const { ApperFileUploader } = window.ApperSDK;
        if (!ApperFileUploader) {
          throw new Error('ApperFileUploader not available in ApperSDK');
        }

        // Set unique element ID
        elementIdRef.current = `file-uploader-${elementId}`;

        // Mount the file field
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        });

        mountedRef.current = true;
        setIsReady(true);
        setError(null);

      } catch (err) {
        console.error('Error initializing ApperFileFieldComponent:', err);
        setError(err.message);
        setIsReady(false);
      }
    };

    initializeSDK();

    // Cleanup on component destruction
    return () => {
      if (mountedRef.current && window.ApperSDK?.ApperFileUploader) {
        try {
          window.ApperSDK.ApperFileUploader.FileField.unmount(elementIdRef.current);
        } catch (err) {
          console.error('Error unmounting ApperFileFieldComponent:', err);
        }
      }
      mountedRef.current = false;
      setIsReady(false);
    };
  }, [elementId, JSON.stringify(memoizedExistingFiles)]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK?.ApperFileUploader || !config.fieldKey) {
      return;
    }

    // Deep equality check with existingFilesRef
    const currentFiles = JSON.stringify(memoizedExistingFiles);
    const previousFiles = JSON.stringify(existingFilesRef.current);
    
    if (currentFiles === previousFiles) {
      return; // No changes
    }

    try {
      const { ApperFileUploader } = window.ApperSDK;
      
      // Detect format: API format has .Id, UI format has .id
      let filesToUpdate = memoizedExistingFiles;
      if (filesToUpdate.length > 0 && filesToUpdate[0].Id !== undefined) {
        // Convert API format to UI format
        filesToUpdate = ApperFileUploader.toUIFormat(memoizedExistingFiles);
      }

      // Update or clear based on content
      if (filesToUpdate.length > 0) {
        ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
      } else {
        ApperFileUploader.FileField.clearField(config.fieldKey);
      }

      // Update ref for next comparison
      existingFilesRef.current = [...memoizedExistingFiles];

    } catch (err) {
      console.error('Error updating files in ApperFileFieldComponent:', err);
      setError(err.message);
    }
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="border-2 border-dashed border-red-300 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">File Upload Error</div>
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main container - SDK takes over when mounted */}
      <div id={elementIdRef.current} className="w-full">
        {!isReady && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-gray-500">Loading file uploader...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;