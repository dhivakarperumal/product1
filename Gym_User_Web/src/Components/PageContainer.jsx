const PageContainer = ({ children, className = "" }) => {
  return (
    <div
      className={`max-w-[1400px] mx-auto px-[6%] sm:px-[5%] lg:px-[3%] ${className}`}
    >
      {children}
    </div>
  );
};

export default PageContainer;
