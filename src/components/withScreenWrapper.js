import ScreenWrapper from "./ScreenWrapper";

// This function takes a Component (like DashboardScreen)
// and returns a new Component that is already wrapped in ScreenWrapper.
export const withScreenWrapper = (Component, wrapperProps = {}) => {
  return (props) => (
    <ScreenWrapper {...wrapperProps}>
      <Component {...props} />
    </ScreenWrapper>
  );
};
