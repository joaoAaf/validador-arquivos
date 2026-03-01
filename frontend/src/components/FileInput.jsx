const FileInput = ({ label, id, onChange, disabled, ...props }) => (
  <div className="mb-6">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <div
      className={`w-full border border-gray-700 rounded-md p-3 text-sm ${disabled ? 'bg-gray-900 text-gray-500' : 'bg-gray-800 text-gray-400'}`}
    >
      <input
        id={id}
        type="file"
        onChange={onChange}
        disabled={disabled}
        {...props}
        className="block w-full text-sm text-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-600 file:text-white
                  file:cursor-pointer
                  hover:file:bg-teal-700 transition
                  disabled:file:bg-gray-700 disabled:file:text-gray-300 disabled:file:cursor-not-allowed"
      />
    </div>
  </div>
);

export default FileInput;
