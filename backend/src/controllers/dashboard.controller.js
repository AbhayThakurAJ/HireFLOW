import * as dashboardService from '../services/dashboard.service.js';

export const getKPIs = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getDashboardKPIs(req.user, from, to);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KPIs' });
  }
};

export const getPipeline = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getPipelineAnalytics(req.user, from, to);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });
    console.error('Error fetching pipeline analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pipeline analytics' });
  }
};

export const getRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getRevenueAnalytics(req.user, from, to);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics' });
  }
};

export const getLeads = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getLeadAnalytics(req.user, from, to);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead analytics' });
  }
};

export const getPerformance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getPerformanceAnalytics(req.user, from, to);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance analytics' });
  }
};
