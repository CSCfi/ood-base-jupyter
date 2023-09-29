%define app_path /www/ood/apps/sys/

Name:           ood-base-jupyter
Version:        2
Release:        1%{?dist}
Summary:        Open on Demand base jupyter app

BuildArch:      noarch

License:        MIT
Source:         %{name}-%{version}.tar.bz2

Requires:       ondemand
Requires:       ood-util
Requires:       ood-initializers

# Disable debuginfo
%global debug_package %{nil}

%description
Open on Demand base jupyter app

%prep
%setup -q

%build

%install

%__install -m 0755 -d %{buildroot}%{_localstatedir}%{app_path}%{name}/template
%__install -m 0755 -D template/* %{buildroot}%{_localstatedir}%{app_path}%{name}/template
%__install -m 0644 manifest.yml *.js *.erb icon.png README.md LICENSE.txt %{buildroot}%{_localstatedir}%{app_path}%{name}/
echo %{version}-%{release} > %{buildroot}%{_localstatedir}%{app_path}%{name}/VERSION

%files

%{_localstatedir}%{app_path}%{name}

%changelog
* Thu Feb 23 2023 Sami Ilvonen <sami.ilvonen@csc.fi>
- Initial version
