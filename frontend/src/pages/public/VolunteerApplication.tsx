import { useState, useEffect } from 'react';
import { validEmail, validName, validPhoneNumber } from '../../utils/index';
import styles from './VolunteerApplication.module.css';
import { useCreateVolunteer } from '../../actions/useVolunteers';
import type { AxiosError } from 'axios';

const VolunteerApplication = () => {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [motivationText, setMotivationText] = useState<string>('');
    const [submitError, setSubmitError] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)

    const createVolunteerMutation = useCreateVolunteer()
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isValid = validEmail(email) && validName(firstName) && validName(lastName) && validPhoneNumber(phoneNumber) && motivationText.length > 0
        if (!isValid) {
            setSubmitError("Please fix the errors in the form above.");
            return;
        }
        const name = firstName + " " + lastName;
        const applicationData = { name, email, "motivation_text": motivationText }
        setIsSubmitting(true)
        createVolunteerMutation.mutate(applicationData, {
            onSuccess: () => {
                setSubmitError('');
                setIsSubmitting(false);
                setIsSuccess(true);
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhoneNumber('');
                setMotivationText('');
            },
            onError: (error: AxiosError) =>{
                setIsSubmitting(false)
                if (error.response) {
                    setSubmitError(String(error.response.status))
                    return
                }
                if (error.request) {
                    setSubmitError("Server unreachable.")
                    return
                }
                setSubmitError("Unexpected error")
            }
        })
    }

    useEffect(()=>{
        setSubmitError('')
    },[firstName, lastName, email, phoneNumber, motivationText])

    if (isSuccess) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Volunteer Application</h1>
                    <p className={styles.subtitle}>Application submitted successfully</p>
                </div>
                <div className={styles.successMessage}>
                    <p>Thank you for applying. We'll review your application and get back to you.</p>
                    <button className={styles.submitBtn} onClick={() => setIsSuccess(false)}>
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
    <div className={styles.container}>
        <div className={styles.header}>
            <h1>Volunteer Application</h1>
            <p className={styles.subtitle}>Join our team</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
                <div className={styles.inputContainer}>
                    <label htmlFor="first-name">First Name</label>
                    <input type="text" id="first-name" className={styles.inputBox} value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                    {firstName && !validName(firstName) && <span className={styles.error}>Invalid name</span>}
                </div>

                <div className={styles.inputContainer}>
                    <label htmlFor="last-name">Last Name</label>
                    <input type="text" id="last-name" className={styles.inputBox} value={lastName} onChange={(e)=>setLastName(e.target.value)} />
                    {lastName && !validName(lastName) && <span className={styles.error}>Invalid name</span>}
                </div>
            </div>

            <div className={styles.formRow}>
                <div className={styles.inputContainer}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" className={styles.inputBox} value={email} onChange={(e)=>setEmail(e.target.value)} />
                    {email && !validEmail(email) && <span className={styles.error}>Invalid email</span>}
                </div>

                <div className={styles.inputContainer}>
                    <label htmlFor="phone-number">Phone Number</label>
                    <input type="tel" id="phone-number" className={styles.inputBox} value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} />
                    {phoneNumber && !validPhoneNumber(phoneNumber) && <span className={styles.error}>Invalid phone number</span>}
                </div>
            </div>

            <div className={styles.inputContainer}>
                <label htmlFor="motivation-text">Why do you want to volunteer?</label>
                <textarea id="motivation-text" className={styles.textArea} value={motivationText} onChange={(e)=>setMotivationText(e.target.value)} rows={4} />
            </div>

            {submitError && <p className={styles.errorMessage}>{submitError}</p>}

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
            </button>
        </form>
    </div>
    );

}

export default VolunteerApplication;