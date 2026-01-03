import type { Volunteer } from '../lib/types';
export const sortVolunteersByStatus = (volunteers: Volunteer[]): [Volunteer[], Volunteer[], Volunteer[]] => {
    const splitByStatus = volunteers.reduce((acc, volunteer) => {
        const status = volunteer.status;
        if (volunteer.status == 'PENDING'){
            acc.pending.push(volunteer);
        }
        else if (status == 'APPROVED'){
            acc.approved.push(volunteer);
        }
        else if (status == 'REJECTED'){
            acc.rejected.push(volunteer);
        }
        return acc
    }, 
    { pending: [] as Volunteer[], approved: [] as Volunteer[], rejected: [] as Volunteer[] }
);
    return [splitByStatus.pending, splitByStatus.approved, splitByStatus.rejected];

}

export const sortByCreatedAt = (volunteers: Volunteer[]): Volunteer[] => {
    return volunteers.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
}

export const sortByVolunteerName = (volunteers: Volunteer[]): Volunteer[] => {
    return volunteers.sort((a, b) => a.name.localeCompare(b.name));
}

export const searchByVolunteerName = (volunteers: Volunteer[], searchCharacters: string): Volunteer[] =>{
    return volunteers.filter(volunteer => volunteer.name.toLowerCase().startsWith(searchCharacters.toLowerCase()))
}