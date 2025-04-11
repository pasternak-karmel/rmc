"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Patient = {
  id: string;
  name: string;
};

type PatientSelectionModalProps = {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
};

export const PatientSelectionModal = ({
  workflowId,
  isOpen,
  onClose,
  onSelectPatient,
}: PatientSelectionModalProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true); // Start loading
        const response = await fetch(`/api/workflow/${workflowId}/patients/get`);
        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }
        const data = await response.json();
        setPatients(data); // Set patients once data is fetched
      } catch (err) {
        console.error("Error fetching patients:", err);
        toast.error("Une erreur s'est produite lors de la récupération des patients.");
      } finally {
        setLoading(false); // End loading after the fetch operation completes
      }
    };

    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen, workflowId]); // Runs when `isOpen` changes

  const handleSelectPatient = (patient: Patient) => {
    onSelectPatient(patient);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-md shadow-lg p-6 max-w-lg w-full">
          <Dialog.Title className="text-xl font-semibold">
            Sélectionnez un patient
          </Dialog.Title>

          {/* Loading state */}
          {loading ? (
            <div
            className="justify-center items-center inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status">
            <span
              className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
              >Loading...</span>
          </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <li
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded"
                  >
                    {patient.name}
                  </li>
                ))
              ) : (
                <li className="text-center text-gray-500 dark:text-gray-400">
                  Plus de patients...
                </li>
              )}
            </ul>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
