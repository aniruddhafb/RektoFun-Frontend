import { MemberStatus } from "./types";

const StatusDot = ({ status }: { status: MemberStatus }) => {
    const styles: Record<MemberStatus, string> = {
        Online: "bg-green-500",
        Away: "bg-yellow-400",
        Offline: "bg-gray-400",
    };
    return (
        <span className={`inline-block w-2 h-2 rounded-full ${styles[status]}`} />
    );
};

export default StatusDot;
