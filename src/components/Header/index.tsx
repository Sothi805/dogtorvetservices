// components/Header
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faChevronDown, faUser } from "@fortawesome/free-solid-svg-icons";

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  language?: string;
}

const Header = ({ title = "Dashboard", actions, language = "ENG" }: HeaderProps) => {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-semibold text-gray-600 Roboto">{title}</h1>
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <span className="text-sm cursor-pointer">{language}</span>
          <span className="text-gray-400">|</span>
          <FontAwesomeIcon icon={faBell} className="text-gray-600 hover:text-gray-800 cursor-pointer" />
        </div>
        <div className="flex items-center space-x-2 cursor-pointer group">
          <FontAwesomeIcon icon={faUser} />
          <FontAwesomeIcon
            icon={faChevronDown}
            className="transition-transform duration-300 group-hover:-rotate-180"
          />
        </div>
        {actions}
      </div>
    </header>
  );
};

export default Header;