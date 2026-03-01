import * as React from "react"
import { Dialog, DialogPanel} from "@headlessui/react"

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ open, onClose,children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      
      {/* Centered panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className="relative w-full max-w-225 rounded-xl bg-white shadow-lg overflow-hidden">
            <button type="button" onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors" aria-label="Close modal"
            >
                ✕
            </button>
            <div className="max-h-[90vh] overflow-y-auto p-5">
                {children}
            </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default Modal;