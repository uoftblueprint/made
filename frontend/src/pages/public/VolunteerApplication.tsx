import { useState, useEffect } from "react";
import { validEmail, validName, validPhoneNumber } from "../../utils";
import { useCreateVolunteer } from "../../actions/useVolunteers";
import type { AxiosError } from "axios";
import Button from "../../components/common/Button";

type VolunteerApplicationProps = {
  onClose?: () => void
}

const VolunteerApplication: React.FC<VolunteerApplicationProps> = ({ onClose = () => {} }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [availableStartDate, setAvailableStartDate] = useState("");
  const [preferredRole, setPreferredRole] = useState("");
  const [motivationText, setMotivationText] = useState("");
  const [interestedEventTypes, setInterestedEventTypes] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const createVolunteerMutation = useCreateVolunteer();

  const toggleEventType = (type: string) => {
    setInterestedEventTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedMotivation = motivationText.trim();

    const isValid =
      validName(trimmedFirst) &&
      validName(trimmedLast) &&
      validEmail(trimmedEmail) &&
      validPhoneNumber(trimmedPhone) &&
      trimmedMotivation.length > 0
    //   availableStartDate.length > 0 &&
    //   interestedEventTypes.length > 0 &&
    //   preferredRole.length > 0; 
    // removed until used by backend

    if (!isValid) {
      setSubmitError("Please fix the errors in the form above before submission.");
      return;
    }

    const applicationData = {
      name: `${trimmedFirst} ${trimmedLast}`,
      email: trimmedEmail,
    //   phone_number: trimmedPhone,
    //   available_start_date: availableStartDate,
    //   preferred_role: preferredRole,
    //   interested_event_types: interestedEventTypes, No endpoint implementation for this data yet
      motivation_text: trimmedMotivation,
    };

    createVolunteerMutation.mutate(applicationData, {
      onSuccess: () => {
        setSubmitError("");
        setAttemptedSubmit(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setMotivationText("");
        setAvailableStartDate("");
        setPreferredRole("");
        setInterestedEventTypes([]);
        alert("Application submitted successfully!"); // TODO: replace with redirect or an alternative
      },
      onError: (error: AxiosError) => {
        if (error.response) {
          setSubmitError(`Request failed (${error.response.status})`);
        } else if (error.request) {
          setSubmitError("Server unreachable. Please check your connection.");
        } else {
          setSubmitError("Unexpected error.");
        }
      },
    });
  };

  useEffect(() => {
    setSubmitError("");
  }, [
    firstName,
    lastName,
    email,
    phoneNumber,
    availableStartDate,
    preferredRole,
    motivationText,
  ]);

  const inputStyle =
    "h-12 rounded-lg border border-border px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition";

  return (
      <>
        <h1 className="title text-[#252525] mb-2">
          Grant Access to New Volunteer
        </h1>

        <p className="form-label mb-4">
          Fill out fields marked with <span className="text-accent">*</span> to create an entry. Everything else is optional and can be added later.
        </p>

        <form id='volunteer-form' onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label className="form-label" htmlFor="firstName">
              First Name <span className="text-accent">*</span>
            </label>
            <input id="firstName"
              className={inputStyle}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {attemptedSubmit && !validName(firstName.trim()) && (
              <span className="text-accent text-xs">Invalid first name</span>
            )}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label className="form-label" htmlFor="lastName">
              Last Name <span className="text-accent">*</span>
            </label>
            <input id="lastName"
              className={inputStyle}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {attemptedSubmit && !validName(lastName.trim()) && (
              <span className="text-accent text-xs">Invalid last name</span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="form-label" htmlFor="email">
              Email Address <span className="text-accent">*</span>
            </label>
            <input
              type="email" id="email"
              placeholder="This will be used for login credentials"
              className={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {attemptedSubmit && !validEmail(email.trim()) && (
              <span className="text-accent text-xs">Invalid email</span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="form-label">
              Available Start Date <span className="text-accent">*</span>
            </label>
            <input
              type="date"
              className={inputStyle}
              value={availableStartDate}
              onChange={(e) => setAvailableStartDate(e.target.value)}
            />
            {attemptedSubmit && availableStartDate.length === 0 && (
              <span className="text-accent text-xs">Start date required</span>
            )}
          </div>

          {/* Section Title */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-[252525]">
              Volunteer Details
            </h2>
          </div>

          {/* Preferred Role */}
          <div className="flex flex-col gap-2">
            <label className="form-label">
              Preferred Role <span className="text-accent">*</span>
            </label>
            <select
              className={inputStyle}
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
            >
              <option value="">Please select a role</option>
              <option value="Logistics">Logistics</option>
              <option value="Registration">Registration</option>
              <option value="Crisis">Crisis</option>
              <option value="Admin">Admin</option>
            </select>
            {attemptedSubmit && preferredRole.length === 0 && (
              <span className="text-accent text-xs">Role required</span>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label className="form-label" htmlFor="phoneNumber">
              Phone Number <span className="text-accent">*</span>
            </label>
            <input id="phoneNumber"
              type="tel"
              className={inputStyle}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {attemptedSubmit && !validPhoneNumber(phoneNumber.trim()) && (
              <span className="text-accent text-xs">Invalid phone number</span>
            )}
          </div>

          {/* Interested Event Types*/}
          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="form-label">
              Interested Event Types <span className="text-accent">*</span>
            </label>

            <div className="flex flex-wrap gap-4">
              {["Event 1", "Event 2", "Event 3", "Event 4"].map(
                (type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={interestedEventTypes.includes(type)}
                      onChange={() => toggleEventType(type)}
                    />
                    {type}
                  </label>
                )
              )}
            </div>

            {attemptedSubmit && interestedEventTypes.length === 0 && (
              <span className="text-accent text-xs">
                Select at least one event type
              </span>
            )}
          </div>

          {/* Motivation - Full Width */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="form-label" htmlFor="motivationText">
              Why do you want to volunteer? <span className="text-accent">*</span>
            </label>
            <textarea id="motivationText"
              className="min-h-30 rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={motivationText}
              onChange={(e) => setMotivationText(e.target.value)}
            />
            {attemptedSubmit && motivationText.trim().length === 0 && (
              <span className="text-accent text-xs">
                Motivation required
              </span>
            )}
          </div>
        </form>
                  <div className='w-full flex justify-end items-center gap-3'>
          {/* Submit */}

          {submitError && (
            <div className="md:col-span-2 text-accent text-sm mt-2">
              {submitError}
            </div>
          )}
          {!submitError && (
            <div></div>
          )}

        <div className="md:col-span-2 flex gap-2 justify-end mt-6">
            <Button type="button" size="xl" radius="md" onClick={onClose} variant={"outline-gray"}
            >
                Cancel
            </Button>
            <Button type='submit' form='volunteer-form' variant={'primary'} size="xl" radius="md"
              disabled={createVolunteerMutation.isPending} className="disabled:opacity-50"
              >
              {createVolunteerMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
        </div>
        </div>
      </>
  );
};

export default VolunteerApplication;