const ActionButton = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-md 
               hover:bg-teal-700 transition duration-150 ease-in-out
               disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center space-x-2"
  >
    {loading ? (
      <>
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
        <span>Aguarde...</span>
      </>
    ) : (
      <span>{children}</span>
    )}
  </button>
);

export default ActionButton;
