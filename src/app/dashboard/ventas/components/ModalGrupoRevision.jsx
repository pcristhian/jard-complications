// components/ModalGrupoRevision.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, FileText, DollarSign, Package } from 'lucide-react';

export default function ModalGrupoRevision({
    isOpen,
    onClose,
    onSubmit,
    ventas,
    groupNote,
    setGroupNote,
    groupColor,
    setGroupColor,
    coloresGrupo,
    loading
}) {
    const total = ventas.reduce((sum, v) => sum + parseFloat(v.total_precio_venta || 0), 0);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Agrupar ventas
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Resumen de ventas */}
                        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Package className="w-4 h-4" />
                                <span className="text-sm font-medium">Ventas seleccionadas</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                                {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
                            </p>
                            <div className="flex items-center gap-2 text-blue-700">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-lg font-semibold">
                                    Total: Bs. {total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Selector de color */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Palette className="w-4 h-4" />
                                Color del grupo
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                                {coloresGrupo.map((color) => (
                                    <button
                                        key={color.hex}
                                        onClick={() => setGroupColor(color.hex)}
                                        className={`w-8 h-8 rounded-lg transition-all ${
                                            groupColor === color.hex
                                                ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.nombre}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Nota */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="w-4 h-4" />
                                Nota / Observación
                            </label>
                            <textarea
                                value={groupNote}
                                onChange={(e) => setGroupNote(e.target.value)}
                                placeholder="Ej: Comprobante #123 - Deposito de 78 Bs"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                maxLength={200}
                            />
                            <p className="text-right text-xs text-gray-400">
                                {groupNote.length}/200
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                'Agrupar ventas'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}