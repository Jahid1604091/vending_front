import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001",
});

api.interceptors.request.use((config) => {
  const adminId = localStorage.getItem("adminId");
  console.log(`API Interceptor: adminId=${adminId}, method=${config.method}, url=${config.url}`);
  if (adminId) {
    if (config.method.toLowerCase() === "get") {
      config.params = { ...config.params, adminId };
      console.log(`Added adminId to params: ${JSON.stringify(config.params)}`);
    } else if (config.data instanceof FormData) {
      let hasAdminId = false;
      for (let [key] of config.data.entries()) {
        if (key === "adminId") {
          hasAdminId = true;
          break;
        }
      }
      if (!hasAdminId) {
        config.data.append("adminId", adminId);
      }
      const formDataEntries = [];
      for (let [key, value] of config.data.entries()) {
        formDataEntries.push(`${key}: ${value instanceof File ? value.name : value}`);
      }
      console.log(`FormData contents: ${formDataEntries.join(", ")}`);
    } else {
      config.data = { ...config.data, adminId };
      console.log(`Added adminId to data: ${JSON.stringify(config.data)}`);
    }
  } else {
    console.warn("No adminId found in localStorage");
  }
  return config;
}, (error) => {
  console.error("Interceptor error:", error);
  return Promise.reject(error);
});

export default api;