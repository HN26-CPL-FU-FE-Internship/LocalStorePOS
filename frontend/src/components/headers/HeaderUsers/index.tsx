import ExportButton from "@/components/common/ExportButton";
import Icon from "@/components/common/Icon";
import type { UserEntry } from "@/types";
import Button from "react-bootstrap/esm/Button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
const HeaderUsers = (filteredUsers: UserEntry[], resetForm: () => void, setShowAdd: (show: boolean) => void) => {
    /* ---------- export helpers ---------- */
    const exportRows = (list: UserEntry[]) =>
        list.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            role: u.role,
            phone: u.phoneNumber,
            email: u.email,
            status: u.status,
        }));

    const handleExportExcel = () => {
        const rows = exportRows(filteredUsers);
        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: ['id', 'firstName', 'lastName', 'fullName', 'role', 'phone', 'email', 'status'],
        });
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [['ID', 'First Name', 'Last Name', 'Full Name', 'Role', 'Phone', 'Email', 'Status']],
            { origin: 'A1' },
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(workbook, `users_${Date.now()}.xlsx`);
    };

    const handleExportPDF = () => {
        const rows = exportRows(filteredUsers);
        const doc = new jsPDF();
        doc.text('Users', 14, 12);
        autoTable(doc, {
            startY: 18,
            head: [['ID', 'First Name', 'Last Name', 'Full Name', 'Role', 'Phone', 'Email', 'Status']],
            body: rows.map((r) => [r.id, r.firstName, r.lastName, r.fullName, r.role, r.phone, r.email, r.status]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [33, 37, 41] },
        });
        doc.save(`users_${Date.now()}.pdf`);
    };
    return (
        <div className="gap-2 d-flex align-items-center flex-wrap">
            <ExportButton handleExportExcel={handleExportExcel} handleExportPdf={handleExportPDF} />
            <Button
                variant="primary"
                className="d-inline-flex align-items-center"
                onClick={() => {
                    resetForm();
                    setShowAdd(true);
                }}
            >
                <Icon name="circle-plus" className="me-1" />
                Add New
            </Button>
        </div>
    );
};

export default HeaderUsers;