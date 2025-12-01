import { useVolunteerApplications, useUpdateVolunteerStatus } from '../../actions/useVolunteers';
import { VolunteerList } from '../../components/items/index.ts';
import { useState } from 'react'

    const ManageVolunteers: React.FC = () => {
        const sortedByOptions = ['Status', 'Date Applied', 'Name'];
        const [sortBy, setSortBy] = useState<string>(sortedByOptions[0]);
        const { data, isLoading, isError } = useVolunteerApplications();
        console.log(data)
        const mutation = useUpdateVolunteerStatus();
        const onApprove = (id: number) => {
            mutation.mutate({id, action: "APPROVED"})
        }
        const onReject = (id: number) => {
            mutation.mutate({id, action: "REJECTED"})
        }
        if (isLoading) return <div>Loading...</div>;
        if (isError) return <div>Error loading volunteer applications.</div>;

        const onSort = () => {
            const currentIndex = sortedByOptions.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % sortedByOptions.length;
            setSortBy(sortedByOptions[nextIndex]);

        }
        return <>
        <h1>Volunteer Management Page</h1> 
        <h2>Sorted by: </h2>
        <button onClick={()=>onSort()}>{sortBy}</button>
        <VolunteerList volunteers={data || []} onApprove={onApprove} onReject={onReject} sortedBy={sortBy} />
        </>

    }

    export default ManageVolunteers;
