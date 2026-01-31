import { checkHealthService } from "../services/health.service.js";

export const healthCheckController = async (req, res) => {
  const health = await checkHealthService();

  res.status(200).json({
    success: true,
    service: "api",
    ...health,
  });
};
