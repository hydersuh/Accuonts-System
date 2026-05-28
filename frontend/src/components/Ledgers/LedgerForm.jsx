import React, { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

function LedgerForm({ initialData, subGroups, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accName: initialData?.accname || "",
    accCode: initialData?.acccode || "",
    subGroupId: initialData?.subgroupid || "",
    openingBalance: initialData?.openingbalance || 0,
    balanceType: initialData?.balancetype || "Dr",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    hasGst: initialData?.hasgst || false,
    gstin: initialData?.gstin || "",
    isBankAccount: initialData?.isbankaccount || false,
    bankName: initialData?.bankname || "",
    accountNumber: initialData?.accountnumber || "",
    ifscCode: initialData?.ifsccode || "",
    description: initialData?.description || "",
    isActive: initialData?.isactive !== undefined ? initialData.isactive : true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.acno) {
        await api.put(`/ledgers/${initialData.acno}`, formData);
        toast.success("Ledger updated successfully");
      } else {
        await api.post("/ledgers", formData);
        toast.success("Ledger created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Name *
          </label>
          <input
            type="text"
            value={formData.accName}
            onChange={(e) =>
              setFormData({ ...formData, accName: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Code *
          </label>
          <input
            type="text"
            value={formData.accCode}
            onChange={(e) =>
              setFormData({ ...formData, accCode: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sub Group *
          </label>
          <select
            value={formData.subGroupId}
            onChange={(e) =>
              setFormData({ ...formData, subGroupId: parseInt(e.target.value) })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus: ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Sub Group</option>
            {subGroups.map((sg) => (
              <option key={sg.subgroupid} value={sg.subgroupid}>
                {sg.subname} ({sg.parentgroup})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Opening Balance
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.openingBalance}
            onChange={(e) =>
              setFormData({
                ...formData,
                openingBalance: parseFloat(e.target.value) || 0,
              })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus: ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Balance Type
          </label>
          <select
            value={formData.balanceType}
            onChange={(e) =>
              setFormData({ ...formData, balanceType: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus: ring-blue-500 focus:border-blue-500"
          >
            <option value="Dr">Debit</option>
            <option value="Cr">Credit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.value === "true" })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus: ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          rows={2}
          className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.hasGst}
            onChange={(e) =>
              setFormData({ ...formData, hasGst: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Has GST</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isBankAccount}
            onChange={(e) =>
              setFormData({ ...formData, isBankAccount: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Is Bank Account</span>
        </label>
      </div>

      {formData.hasGst && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            GSTIN
          </label>
          <input
            type="text"
            value={formData.gstin}
            onChange={(e) =>
              setFormData({ ...formData, gstin: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {formData.isBankAccount && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              IFSC Code
            </label>
            <input
              type="text"
              value={formData.ifscCode}
              onChange={(e) =>
                setFormData({ ...formData, ifscCode: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={2}
          className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover: bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default LedgerForm;
