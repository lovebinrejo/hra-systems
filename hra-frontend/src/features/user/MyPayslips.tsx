import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { payslipService } from '../../services/payslipService';
import type { Payslip } from '../../types';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MyPayslips: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    payslipService.getPayslips({ page_size: 24 })
      .then(res => setPayslips(res.data.results))
      .catch(() => toast.error('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (ps: Payslip) => {
    setDownloadingId(ps.id);
    try {
      const res = await payslipService.downloadPayslip(ps.id);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${MONTHS[ps.month]}_${ps.year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
        <p className="text-gray-500 text-sm">Download your monthly salary slips</p>
      </div>

      {payslips.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payslips available yet.</p>
          <p className="text-gray-400 text-sm mt-1">Payslips are generated monthly by your admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((ps) => (
            <div key={ps.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{MONTHS[ps.month]} {ps.year}</p>
                  <Badge variant={ps.status}>{ps.status}</Badge>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Gross Salary</span>
                  <span className="font-medium">₹{Number(ps.gross_salary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deductions</span>
                  <span className="text-red-600">- ₹{(Number(ps.pf_deduction) + Number(ps.tax_deduction) + Number(ps.other_deductions) + Number(ps.loss_of_pay)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Net Salary</span>
                  <span className="text-green-600">₹{Number(ps.net_salary).toLocaleString()}</span>
                </div>
              </div>
              {ps.pdf_path && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 justify-center"
                  loading={downloadingId === ps.id}
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => handleDownload(ps)}
                >
                  Download PDF
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPayslips;
