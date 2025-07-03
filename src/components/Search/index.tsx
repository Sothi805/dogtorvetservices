import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Search: React.FC<SearchProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search customers..." 
}) => {
  return (
    <div className="flex items-center w-full border border-gray-300 px-3 py-2 rounded-md bg-white focus-within:ring-2 focus-within:ring-[#007c7c] focus-within:border-transparent">
      <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-2" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full outline-none text-sm text-gray-700 bg-transparent"
      />
    </div>
  );
};

export default Search;
