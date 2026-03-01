const ResponseModal = ({ modalData, onClose }) => {
  if (!modalData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-md">
      <div className="bg-gray-900/95 border border-gray-700 p-8 rounded-lg shadow-2xl max-w-2xl w-full relative">
        <h2 className="text-2xl font-bold mb-6">{modalData.title}</h2>

        {modalData.data ? (
          <div className="mb-6 overflow-hidden rounded-lg border border-gray-700">
            <table className="w-full">
              <tbody>
                {modalData.data.map((item, index) => (
                  <tr key={index} className="border-b border-gray-700 last:border-b-0">
                    <td className="bg-gray-800 px-4 py-3 font-semibold text-gray-300 w-1/3">
                      {item.label}
                    </td>
                    <td className="bg-gray-850 px-4 py-3 text-gray-200 break-all">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300 mb-6 whitespace-pre-wrap">{modalData.message}</p>
        )}

        {modalData.txLink && (
          <a
            href={modalData.txLink}
            target="_blank"
            rel="noreferrer"
            className="block text-teal-400 font-medium mb-6 hover:text-teal-300 underline break-all"
          >
            Ver Transação na PolygonScan
          </a>
        )}
        <button
          onClick={onClose}
          className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-600 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default ResponseModal;
