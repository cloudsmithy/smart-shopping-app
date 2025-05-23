import { useEffect, useState } from "react";
import { initUser } from "@/api/ai";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);
      setLoading(false);
      return;
    }

    // 生成一个简单的设备ID（实际项目中可能需要更复杂的逻辑）
    const generateDeviceId = () => {
      const existingDeviceId = localStorage.getItem("device_id");
      if (existingDeviceId) return existingDeviceId;

      const newDeviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
      localStorage.setItem("device_id", newDeviceId);
      return newDeviceId;
    };

    const deviceId = generateDeviceId();

    setLoading(true);
    initUser(deviceId)
      .then((response) => {
        if (response.access_token) {
          localStorage.setItem("token", response.access_token);
          setToken(response.access_token);
        } else {
          setError(response.message || "初始化用户失败");
        }
      })
      .catch((err) => {
        setError(err.message || "初始化用户请求失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { token, loading, error };
}
