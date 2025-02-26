import React, { createContext, useState, useContext } from "react";

// Create the context
const AddItemFlowContext = createContext();

// Provider to wrap around AddItemFlow and give access to data
export const AddItemFlowProvider = ({ children }) => {
  const [imageBase64, setImageBase64] = useState(null);
  const [cutoutBase64, setCutoutBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateImage = (base64) => setImageBase64(base64);
  const updateCutout = (base64) => setCutoutBase64(base64);
  const setLoadingState = (state) => setLoading(state);

  return (
    <AddItemFlowContext.Provider
      value={{ imageBase64, cutoutBase64, loading, updateImage, updateCutout, setLoadingState }}
    >
      {children}
    </AddItemFlowContext.Provider>
  );
};

// Custom hook to access the context data
export const useAddItemFlowContext = () => useContext(AddItemFlowContext);
