import React, { useState, useEffect } from "react";
import api from "../services/api";
import DataTable from "../components/Common/DataTable";
import Modal from "../components/Common/Modal";
import LedgerForm from "../components/Ledgers/LedgerForm";
import LedgerDetails from "../components/Ledgers/LedgerDetails";
import toast from "react-hot-toast";
import { PlusIcon } from "@heroicons/react/24/outline";

function Ledgers() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [subGroups, setSubGroups] = useState([]);

  useEffect(() => {
    fetchLedgers();
    fetchSubGroups();
  }, []);

  const fetchLedgers = async () => {
    try {
      const response = await api.get("/ledgers");
      setLedgers(response.data);
    } catch (error) {
      toast.error("Failed to fetch ledgers");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubGroups = async () => {
    try {
      const response = await api.get("/groups/subgroup");
      setSubGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch subgroups:", error);
    }
  };

  const handleCreate = () => {
    setSelectedLedger(null);
    setShowForm(true);
  };

  const handleEdit = (ledger) => {
    setSelectedLedger(ledger);
    setShowForm(true);
  };

  const handleView = (ledger) => {
    setSelectedLedger(ledger);
    setShowDetails(true);
  };

  const handleDelete = async (ledger) => {
    if (
      window.confirm(
        `Are you sure you want to delete ledger "${ledger.accname}"?`,
      )
    ) {
      try {
        await api.delete(`/ledgers/${ledger.acno}`);
        toast.success("Ledger deleted successfully");
        fetchLedgers();
      } catch (error) {
        toast.error("Failed to delete ledger");
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchLedgers();
  };

  const columns = [
    { Header: "Account Name", accessor: "accname", sortable: true },
    { Header: "Account Code", accessor: "acccode", sortable: true },
    { Header: "Sub Group", accessor: "subgroup_name", sortable: true },
    { Header: "Group", accessor: "group_name", sortable: true },
    {
      Header: "Opening Balance",
      accessor: "openingbalance",
      Cell: ({ value }) => `$${parseFloat(value || 0).toLocaleString()}`,
      sortable: true,
    },
    { Header: "Type", accessor: "balancetype", sortable: true },
    {
      Header: "Bank Account",
      accessor: "isbankaccount",
      Cell: ({ value }) => (value ? "Yes" : "No"),
    },
    {
      Header: "Status",
      accessor: "isactive",
      Cell: ({ value }) => (value ? "Active" : "Inactive"),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ledgers</h1>
          <p className="text-gray-500">Manage all your ledger accounts</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Ledger
        </button>
      </div>

      <DataTable
        columns={columns}
        data={ledgers}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selectedLedger ? "Edit Ledger" : "New Ledger"}
        size="large"
      >
        <LedgerForm
          initialData={selectedLedger}
          subGroups={subGroups}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Ledger Details"
        size="large"
      >
        <LedgerDetails ledger={selectedLedger} />
      </Modal>
    </div>
  );
}

export default Ledgers;
