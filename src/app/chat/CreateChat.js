import * as React from "react";
import classNames from "clsx";
import { useLocation } from "wouter";
import useForm from "react-hook-form";
import cogoToast from "cogo-toast";
import restrictWithTronWeb from "app/tron/restrictWithTronWeb";
import useContractContext from "app/tron/useContractContext";
import ContentContainer from "app/page/ContentContainer";
import Header from "app/page/Header";

const CreateChat = restrictWithTronWeb(() => {
  const contract = useContractContext();

  const [creating, setCreating] = React.useState(false);

  const setLocation = useLocation()[1];

  const handleSubmit = React.useCallback(
    async ({ members }) => {
      if (!contract || creating) {
        return;
      }

      setCreating(true);

      try {
        const chatId = await contract
          .openChat(
            members,
            contract.tronWeb.toHex(23),
            contract.tronWeb.toHex(5)
          )
          .send({
            shouldPollResponse: true
          });

        setCreating(false);
        setLocation(`/chat/${chatId}`);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        cogoToast.error(err.message);
        setCreating(false);
      }
    },
    [contract, creating, setLocation]
  );

  return (
    <ContentContainer>
      <Header showCreateChat={false} />
      <Form loading={creating} onSubmit={handleSubmit} />
    </ContentContainer>
  );
});

export default CreateChat;

const Form = ({ onSubmit, loading = false }) => {
  const { register, handleSubmit, errors } = useForm();
  const [members, setMembers] = React.useState(createArrayWithNumbers(1));

  const addMember = React.useCallback(() => {
    setMembers(currentMembers => {
      const last = currentMembers[currentMembers.length - 1];
      return [...currentMembers, last + 1];
    });
  }, [setMembers]);

  const removeMember = React.useCallback(
    memberForRemove => {
      setMembers(currentMembers =>
        currentMembers.filter(mmbr => mmbr !== memberForRemove)
      );
    },
    [setMembers]
  );

  return (
    <form
      className="w-full rounded-b overflow-hidden"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="p-4 bg-white">
        {members.map((member, index) => {
          const removeDisabled = member === 0;
          const errored = Boolean(errors[member]);

          return (
            <div
              key={member}
              className={classNames("w-full mb-6", "border-b border-gray-200")}
            >
              <label
                className={classNames(
                  "block",
                  "mb-2",
                  "uppercase tracking-wide",
                  "text-gray-700 text-xs font-bold"
                )}
                htmlFor={`member-address-${member}`}
              >
                {members.length > 1
                  ? `Member ${index + 1} address`
                  : "Member address"}
              </label>
              <div className="mb-2 flex items-stretch">
                <input
                  ref={register({ required: true })}
                  className={classNames(
                    "appearance-none",
                    "block w-full",
                    "bg-gray-200 focus:bg-white focus:outline-none",
                    "border-2",
                    errored ? "border-red-500" : "border-gray-500",
                    "text-gray-700 rounded py-3 px-4 leading-tight"
                  )}
                  id={`member-address-${member}`}
                  type="text"
                  name={`members[${member}]`}
                  placeholder="TRHL8...AGf7aPd3Gq"
                />
                <button
                  type="button"
                  className={classNames(
                    "ml-2 w-16",
                    "border-2 border-gray-500",
                    "rounded",
                    "text-gray-500",
                    "flex items-center justify-center",
                    removeDisabled && "opacity-25"
                  )}
                  disabled={removeDisabled}
                  onClick={() => removeMember(member)}
                >
                  <svg
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    aria-labelledby="minusIconTitle"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    fill="none"
                    className="stroke-current"
                  >
                    <title id="minusIconTitle">Minus</title>
                    <path d="M20,12 L4,12" />
                  </svg>
                </button>
              </div>
              {errored ? (
                <p className="text-red-500 text-xs italic">
                  Please fill out this field.
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="mb-2 flex justify-center">
          <button
            type="button"
            className={classNames(
              "py-1 px-4",
              "border-2 border-gray-500",
              "rounded",
              "text-gray-500 text-base font-medium",
              "flex items-center"
            )}
            onClick={addMember}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-labelledby="personAddIconTitle"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              fill="none"
              className="stroke-current"
            >
              <title id="personAddIconTitle">Add user</title>
              <path d="M1 18C1 15.75 4 15.75 5.5 14.25C6.25 13.5 4 13.5 4 9.75C4 7.25025 4.99975 6 7 6C9.00025 6 10 7.25025 10 9.75C10 13.5 7.75 13.5 8.5 14.25C10 15.75 13 15.75 13 18" />
              <path d="M22 11H14" />
              <path d="M18 7V15" />
            </svg>

            <span className="ml-1">Add one more Member</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-4">
        <button
          className={classNames(
            "bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline",
            loading && "opacity-50"
          )}
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Chat"}
        </button>
      </div>
    </form>
  );
};

function createArrayWithNumbers(length) {
  return Array.from({ length }, (_, i) => i);
}