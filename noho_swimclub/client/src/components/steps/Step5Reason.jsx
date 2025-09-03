function Step5Reason({ formData, setFormData, next, back }) {
    const handleChange = (e) => setFormData({ ...formData, reason: e.target.value });
  
    return (
      <div className="space-y-4">
        <label className="block font-semibold">Why are you creating an account?</label>
        <div className="space-y-2">
          {['membership', 'swim lessons', 'other'].map((option) => (
            <label key={option} className="block">
              <input type="radio" name="reason" value={option} checked={formData.reason === option} onChange={handleChange} className="mr-2" />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button onClick={back} className="px-4 py-2 bg-gray-400 text-white rounded">Back</button>
          <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
        </div>
      </div>
    );
  }
  
  export default Step5Reason;