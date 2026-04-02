import * as React from "react"
import { Dialog, DialogPanel} from "@headlessui/react"
import './Modal.css'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}

function Modal({ open, onClose, title, children, wide }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Centered panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className={`relative w-full ${wide ? 'max-w-[640px]' : 'max-w-225'} rounded-xl bg-white shadow-lg overflow-hidden`}>
            <button type="button" onClick={onClose}
            className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition-colors z-10" aria-label="Close modal"
            >
                ✕
            </button>
            <div className="max-h-[90vh] overflow-y-auto p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-[var(--spacing-md)] pr-6">{title}</h2>
                {children}
            </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default Modal;
