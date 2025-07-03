// components/Card
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface CardProps {
  color: string;
  icon: any;
  title: string;
  value: string | number;
  description?: string;
}

const Card = ({ color, icon, title, value, description }: CardProps) => {
  return (
    <div className="basis-1/4 bg-white p-4 space-y-2 rounded-md shadow-sm">
      <div className="flex justify-between">
        <div>
          <h2 className={`text-${color}-400 text-2xl font-semibold Albert-Sans`}>{value}</h2>
          <h2 className="font-bold Roboto text-gray-700">{title}</h2>
        </div>
        <div className={`flex justify-center items-center w-[50px] h-[50px] rounded-full bg-${color}-400`}>
          <FontAwesomeIcon icon={icon} className="text-white text-xl" />
        </div>
      </div>
      {description && <h3 className="Roboto text-gray-500 text-sm">{description}</h3>}
    </div>
  );
};

export default Card;