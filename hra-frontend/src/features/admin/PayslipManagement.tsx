import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Zap, Search } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { payslipService } from '../../services/payslipService';
import type { Payslip } from '../../types';
import { format } from 'date-fns';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayslipManagement: React.FC = () => {
  const today = new Date();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payslipService.getPayslips({ month, year, page_size: 50 });
      setPayslips(res.data.results);
    } catch {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const handleGenerateBulk = async () => {
    setBulkLoading(true);
    try {
      const res = await payslipService.generateBulk(month, year);
      toast.success(`Generated ${res.data.total} payslips for ${MONTHS[month]} ${year}`);
      fetchPayslips();
    } catch {
      toast.error('Bulk generation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownload = async (payslip: Payslip) => {
    setDownloadingId(payslip.id);
    try {
      const res = await payslipService.downloadPayslip(payslip.id);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payslip.user_name}_${MONTHS[payslip.month]}_${payslip.year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payslip Management</h1>
          <p className="text-gray-500 text-sm">Generate and manage employee payslips</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input-field w-36" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field w-24" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button icon={<Zap className="w-4 h-4" />} loading={bulkLoading} onClick={handleGenerateBulk}>
            Generate All
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gross</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Net</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payslips.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                    No payslips for {MONTHS[month]} {year}. Click "Generate All" to create them.
                  </td></tr>
                ) : payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{ps.user_name}</p>
                      <p className="text-xs text-gray-400">{ps.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize hidden md:table-cell">{ps.user_department}</td>
                    <td className="px-4 py-3 text-gray-600">₹{Number(ps.gross_salary).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">₹{Number(ps.net_salary).toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge variant={ps.status}>{ps.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {ps.pdf_path && (
                        <button
                          onClick={() => handleDownload(ps)}
                          disabled={downloadingId === ps.id}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayslipManagement;
