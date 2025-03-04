import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import templateService from "../../services/template.service";

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await templateService.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      } else {
        toast.error(response.message || "Failed to fetch templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await templateService.deleteTemplate(id);
      if (response.success) {
        toast.success("Template deleted successfully");
        setTemplates(templates.filter((template) => template._id !== id));
      } else {
        toast.error(response.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await templateService.setDefaultTemplate(id);
      if (response.success) {
        toast.success("Default template updated");
        fetchTemplates(); // Refresh to update all templates
      } else {
        toast.error(response.message || "Failed to set default template");
      }
    } catch (error) {
      console.error("Error setting default template:", error);
      toast.error("Failed to set default template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Quotation Templates
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your quotation templates and designs
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/templates/create"
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Template
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/templates/edit/${template._id}`}
                      className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(template._id)}
                      className="p-2 text-red-400 hover:text-red-500 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {template.description || "No description"}
                </p>

                <div className="mt-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      template.isDefault
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {template.isDefault
                      ? "Default Template"
                      : "Alternative Template"}
                  </span>
                </div>

                <div className="mt-4 text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Layout:</span>
                    <span className="ml-2 capitalize">{template.layout}</span>
                  </div>
                </div>

                {!template.isDefault && (
                  <button
                    onClick={() => handleSetDefault(template._id)}
                    className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-gray-300 
                             dark:border-gray-600 rounded-md shadow-sm text-sm font-medium 
                             text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                             hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none 
                             focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                             dark:focus:ring-offset-gray-800"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No templates found. Create your first template to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateList;
