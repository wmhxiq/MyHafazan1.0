"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Tutup",
  cancelText = "Batal",
  onConfirm,
  showCancel = false,
  autoClose = false,
  autoCloseDuration = 5000,
}: AlertModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Auto-close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  // Icon and color configuration
  const config = {
    info: {
      icon: InformationCircleIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      progressBg: "bg-blue-600",
    },
    success: {
      icon: CheckCircleIcon,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      buttonBg: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      progressBg: "bg-green-600",
    },
    error: {
      icon: XCircleIcon,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      progressBg: "bg-red-600",
    },
    warning: {
      icon: InformationCircleIcon,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      progressBg: "bg-yellow-600",
    },
  };

  const Icon = config[type].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8,
            }}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Auto-close progress bar */}
            {autoClose && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: autoCloseDuration / 1000,
                    ease: "linear",
                  }}
                  className={`h-full ${config[type].progressBg}`}
                />
              </div>
            )}

            <div className="p-6">
              {/* Close button */}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {/* Icon and Content */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-4">
                <div
                  className={`flex-shrink-0 mx-auto sm:mx-0 flex h-14 w-14 items-center justify-center rounded-full ${config[type].iconBg} mb-4 sm:mb-0`}
                >
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                  >
                    <Icon
                      className={`h-7 w-7 ${config[type].iconColor}`}
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold leading-6 text-gray-900 mb-2"
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 sm:w-auto ${config[type].buttonBg}`}
                onClick={handleConfirm}
              >
                {confirmText}
              </motion.button>

              {showCancel && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 sm:mt-0 sm:w-auto"
                  onClick={onClose}
                >
                  {cancelText}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
