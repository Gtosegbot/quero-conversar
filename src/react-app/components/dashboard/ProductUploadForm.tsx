
const ProductUploadForm: React.FC<ProductUploadFormProps> = ({ userId, onSuccess, onCancel }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'ebook', // ebook, course, session, other
        link: '' // External link if applicable, or we handle file delivery later
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let imageUrl = '';

            // 1. Upload Image
            if (imageFile) {
                const storageRef = ref(storage, `products/${userId}/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            // 2. Save to Firestore
            await addDoc(collection(db, 'products'), {
                partnerId: userId,
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                link: formData.link,
                imageUrl,
                sales: 0,
                createdAt: serverTimestamp()
            });

            onSuccess();
        } catch (error) {
            console.error("Error uploading product:", error);
            alert("Erro ao criar produto. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-600" />
                    Novo Produto
                </h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" required />
                        </label>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Produto</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Ex: E-book Ansiedade Zero"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R$</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full rounded-lg border-gray-300 border p-2 pl-10 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="ebook">E-book / Digital</option>
                        <option value="course">Curso Online</option>
                        <option value="session">Sessão / Mentoria</option>
                        <option value="physical">Produto Físico</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Descreva os benefícios do seu produto..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link de Acesso/Venda (Opcional)</label>
                    <input
                        type="url"
                        value={formData.link}
                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                        className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Se você usa Hotmart, Eduzz, etc., cole o link aqui.</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Publicar Produto'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductUploadForm;
