export const stateChangeHandler = (setState) => {
  return (title, value) => {
    setState((prevState) => ({
      ...prevState,
      [title]: value,
    }));
  };
};
