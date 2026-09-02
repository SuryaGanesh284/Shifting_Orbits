const analyticsService = require('../services/analytics.service');
const { asyncHandler } = require('../middleware/errorHandler');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getInstitutionalOverview();
  res.status(200).json({ success: true, data: overview });
});

const getCenters = asyncHandler(async (req, res) => {
  const centers = await analyticsService.getCenterComparison();
  res.status(200).json({ success: true, count: centers.length, data: centers });
});

const getCenterDetails = asyncHandler(async (req, res) => {
  const details = await analyticsService.getCenterDetails(req.params.centerId);
  res.status(200).json({ success: true, data: details });
});

const exportReport = asyncHandler(async (req, res) => {
  const format = req.query.format || 'json';
  const result = await analyticsService.exportReport(req.params.reportType, format);

  if (format.toLowerCase() === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.reportType}_${Date.now()}.csv"`);
    return res.status(200).send(result);
  }

  res.status(200).json({
    success: true,
    reportType: req.params.reportType,
    count: Array.isArray(result) ? result.length : 1,
    data: result
  });
});

module.exports = {
  getOverview,
  getCenters,
  getCenterDetails,
  exportReport
};
