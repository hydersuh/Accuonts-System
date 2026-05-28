import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../services/utils";

function LedgerDetails({ ledger }) {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), 3, 1).toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (ledger) {
      fetchStatement();
    }
  }, [ledger, fromDate, toDate]);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reports/ledger-statement", {
        params: { ledgerId: ledger.acno, fromDate, toDate },
      });
      setStatement(response.data);
    } catch (error) {
      console.error("Failed to fetch ledger statement:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!ledger) return null;

  return (
    <div className="space-y-4">
      {/* Ledger Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Account Name</p>
          <p className="font-medium">{ledger.accname}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Account Code</p>
          <p className="font-medium">{ledger.acccode}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Account Path</p>
          <p className="font-medium text-sm">{ledger.account_path || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Balance Type</p>

          <p className="font-medium">{ledger.balancetype}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Opening Balance</p>
          <p className="font-medium">{formatCurrency(ledger.openingbalance)}</p>
        </div>
        {ledger.isbankaccount && (
          <>
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium">{ledger.bankname || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">{ledger.accountnumber || "-"}</p>
            </div>
          </>
        )}
      </div>

      {/* Date Filters */}
      <div className="flex space-x-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1"
          />
        </div>
        <button
          onClick={fetchStatement}
          className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Statement Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        statement && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Voucher No
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Narration
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Debit
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Credit
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm">Opening Balance</td>
                  <td colSpan="4"></td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(statement.openingBalance?.amount)}
                  </td>
                </tr>
                {statement.transactions?.map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm">
                      {formatDate(t.entrydate)}
                    </td>
                    <td className="px-4 py-2 text-sm">{t.voucherno}</td>
                    <td className="px-4 py-2 text-sm">{t.vouchername}</td>
                    <td className="px-4 py-2 text-sm">{t.narration}</td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(t.debit)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(t.credit)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium">
                      {formatCurrency(t.runningbalance)}
                    </td>
                  </tr>
                ))}
                {statement.closingBalance && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="5" className="px-4 py-2 text-right">
                      Closing Balance
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(statement.closingBalance.amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

export default LedgerDetails;
