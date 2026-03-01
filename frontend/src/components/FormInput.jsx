const FormInput = ({ label, id, ...props }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-3 text-sm focus:border-teal-500 focus:ring-teal-500 focus:outline-none transition"
    />
  </div>
);

export default FormInput;
