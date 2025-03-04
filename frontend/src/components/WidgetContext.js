import { createContext, useContext, useState } from "react";

// Create Context
const WidgetContext = createContext();

// Provider Component
export const WidgetProvider = ({ children }) => {
  const [widgetData, setWidgetData] = useState({
    city: null,
    weather: null,
  });

  return (
    <WidgetContext.Provider value={{ widgetData, setWidgetData }}>
      {children}
    </WidgetContext.Provider>
  );
};

// Custom Hook to use the context
export const useWidgetContext = () => useContext(WidgetContext);
