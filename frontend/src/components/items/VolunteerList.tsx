import type { Volunteer } from "../../lib/types";
import { sortVolunteersByStatus, sortByCreatedAt, sortByVolunteerName, searchByVolunteerName } from "../../utils/index.ts";

const VolunteerList: React.FC<{ volunteers: Volunteer[], onApprove: (id:number) => void, onReject: (id:number) => void, sortedBy: string, searchBy: string }> = ({ volunteers, onApprove, onReject, sortedBy, searchBy }) => {

    if (!volunteers || volunteers.length === 0 ){
        return <p>No volunteer applications found.</p>
    }

    if (sortedBy == 'Status'){
        const sorted = sortVolunteersByStatus(searchByVolunteerName(volunteers, searchBy));
        return (<>
        <ul>
            <strong>Pending</strong>
            {sorted[0].map((volunteer) =>{
                return (<>
                <li key={volunteer.id}>
                    <strong>{volunteer.name}</strong> - {volunteer.email}
                    <p>Motivation: {volunteer.motivation_text}</p>
                    <button onClick={() => onApprove(volunteer.id)}>Approve</button>
                    <button onClick={() => onReject(volunteer.id)}>Reject</button>
                </li>
                </>)
            })}
            <strong>Approved</strong>
            {sorted[1].map((volunteer) =>{
                return (<li key={volunteer.id}>
                    <strong>{volunteer.name}</strong> - {volunteer.email}
                    <p>Reviewed at: {volunteer.reviewed_at}</p>
                    <p>Reviewed by: {volunteer.reviewed_by}</p>
                </li>)
            })}
            <strong>Rejected</strong>
            {sorted[2].map((volunteer) =>{
                return (<li key={volunteer.id}>
                    <strong>{volunteer.name}</strong> - {volunteer.email}
                    <p>Motivation: {volunteer.motivation_text}</p>
                    <p>Reviewed at: {volunteer.reviewed_at}</p>
                    <p>Reviewed by: {volunteer.reviewed_by}</p>
                </li>)
            })}
        </ul>
    </>)
    }
    else if (sortedBy == 'Date Applied'){
        const sorted = sortByCreatedAt(volunteers);
        return sorted.map((volunteer) =>{
            return (<li key={volunteer.id}>
                <strong>{volunteer.name}</strong> - {volunteer.email}
                <p>Status: {volunteer.status}</p>
                {volunteer.status == 'PENDING' && (<>
                <p>Motivation: {volunteer.motivation_text}</p>
                <button onClick={() => onApprove(volunteer.id)}>Approve</button>
                <button onClick={() => onReject(volunteer.id)}>Reject</button>
                </>)}

                {volunteer.status == 'APPROVED' 
                && (<>
                <p>Reviewed at: {volunteer.reviewed_at}</p>
                <p>Reviewed by: {volunteer.reviewed_by}</p>
                </>)}

                {volunteer.status == 'REJECTED' 
                && (<><p>Motivation: {volunteer.motivation_text}</p>
                <p>Reviewed at: {volunteer.reviewed_at}</p>
                <p>Reviewed by: {volunteer.reviewed_by}</p>
                </>)}
            </li>)
        });
    }
    else if (sortedBy == 'Name'){
        const sorted = sortByVolunteerName(volunteers);
        return sorted.map((volunteer) =>{
            return (<li key={volunteer.id}>
                <strong>{volunteer.name}</strong> - {volunteer.email}
                <p>Status: {volunteer.status}</p>
                {volunteer.status == 'PENDING' && (<>
                <p>Motivation: {volunteer.motivation_text}</p>
                <button onClick={() => onApprove(volunteer.id)}>Approve</button>
                <button onClick={() => onReject(volunteer.id)}>Reject</button>
                </>)}

                {volunteer.status == 'APPROVED' 
                && (<>
                <p>Reviewed at: {volunteer.reviewed_at}</p>
                <p>Reviewed by: {volunteer.reviewed_by}</p>
                </>)}

                {volunteer.status == 'REJECTED' 
                && (<><p>Motivation: {volunteer.motivation_text}</p>
                <p>Reviewed at: {volunteer.reviewed_at}</p>
                <p>Reviewed by: {volunteer.reviewed_by}</p>
                </>)}
            </li>)
        });
    }
}

export default VolunteerList;
