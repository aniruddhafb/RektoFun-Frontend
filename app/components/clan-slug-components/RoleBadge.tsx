import { MemberRole } from "./types";

type ClanMemberRole = "Leader" | "Member";

interface RoleBadgeProps {
    role: MemberRole | ClanMemberRole;
}

const RoleBadge = ({ role }: RoleBadgeProps) => {
    const styles: Record<string, string> = {
        Leader: "bg-amber-100 text-amber-700 border border-amber-200",
        "Co-Leader": "bg-blue-100 text-blue-700 border border-blue-200",
        Member: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role] || styles.Member}`}>
            {role}
        </span>
    );
};

export default RoleBadge;
