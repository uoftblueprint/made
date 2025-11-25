    import { apiClient } from '../../api/index';
    import type { VolunteerApplication } from '../../lib/types';
    import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

    const ManageVolunteers: React.FC = () => {
        const queryClient = useQueryClient();

        const { data, isLoading, isError } = useQuery<VolunteerApplication[]>({
            queryKey: ['volunteerApplications'],
            queryFn: async () => {
                const response = await apiClient.get('/api/volunteer-applications/');
                return response.data;
            }
        });

        const mutation = useMutation({
            mutationFn: async ({ id, action }: { id: number; action: 'APPROVED' | 'REJECTED' }) => {
                await apiClient.patch(`/api/volunteer-applications/${id}/`, { status: action });
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['volunteerApplications'] });
        }
        })

        if (isLoading) return <div>Loading...</div>;
        if (isError) return <div>Error loading volunteer applications.</div>;

        return <>
        <h1>Volunteer Management Page</h1> 
        { !data || data.length === 0 ? (
            <p>No volunteer applications found.</p> ) : (
            <ul>
                {data.map((application) =>{
                    return (<>
                    <li key={application.id}>
                        <strong>{application.name}</strong> - {application.email}
                        <p>Motivation: {application.motivation_text}</p>
                        <p>Status: {application.status}</p>
                    </li>
                    {application.status == "PENDING" && (<>
                    <button onClick={() => mutation.mutate({id: application.id, action: "APPROVED"})}>Approve</button>
                    <button onClick={() => mutation.mutate({id: application.id, action: "REJECTED"})}>Reject</button>
                    </>
                )}
                    </>)
                })}
            </ul>
            )
        }
        </>

    }

    export default ManageVolunteers;
