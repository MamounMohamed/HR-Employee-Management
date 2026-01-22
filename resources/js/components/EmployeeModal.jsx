import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { API } from '../api';
import { useToast } from '../context/ToastContext';
import { UserRoleEnum } from '../enums/UserRoleEnum';

const EmployeeModal = ({ employee, onClose, onSuccess }) => {
    const isEdit = !!employee;
    const { addToast } = useToast();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors, isSubmitting, isValid }
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            name: '',
            email: '',
            role: '',
            department: '',
            status: 'active',
            password: '',
            password_confirmation: ''
        }
    });

    const [globalError, setGlobalError] = useState('');
    const [fetchingData, setFetchingData] = useState(false);

    // Watch password for confirmation validation
    const password = watch("password");

    useEffect(() => {
        if (isEdit && employee) {
            // Set initial data from props
            reset({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                department: employee.department || '',
                status: employee.status || 'active',
                password: '',
                password_confirmation: ''
            });

            // Fetch fresh data from API
            const loadData = async () => {
                setFetchingData(true);
                try {
                    const res = await API.getEmployee(employee.id);
                    reset({
                        ...res.data,
                        department: res.data.department || '',
                        password: '',
                        password_confirmation: ''
                    });
                } catch (err) {
                    console.error('Failed to fetch employee details', err);
                    setGlobalError('Failed to fetch fresh data for this employee.');
                    addToast('Failed to load employee details', 'error');
                } finally {
                    setFetchingData(false);
                }
            };
            loadData();
        } else {
            reset({
                name: '',
                email: '',
                role: '',
                department: '',
                status: 'active',
                password: '',
                password_confirmation: ''
            });
        }
    }, [isEdit, employee, reset, addToast]);

    const onSubmit = async (data) => {
        setGlobalError('');

        try {
            const dataToSend = { ...data };
            if (!dataToSend.department) dataToSend.department = null;

            // Remove password fields if empty in edit mode
            if (isEdit && !dataToSend.password) {
                delete dataToSend.password;
                delete dataToSend.password_confirmation;
            }

            if (isEdit) {
                await API.updateEmployee(employee.id, dataToSend);
                addToast('Employee updated successfully', 'success');
            } else {
                await API.createEmployee(dataToSend);
                addToast('Employee created successfully', 'success');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            const msg = err.message || 'Failed to save employee';
            addToast(msg, 'error');

            if (err.errors) {
                Object.keys(err.errors).forEach(key => {
                    setError(key, {
                        type: 'manual',
                        message: err.errors[key][0]
                    });
                });
            } else {
                setGlobalError(msg);
            }
        }
    };

    return (
        <div className="modal-overlay active" onClick={(e) => { if (e.target.className.includes('modal-overlay')) onClose(); }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {fetchingData ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading employee data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {globalError && <div className="alert alert-error">{globalError}</div>}

                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Full Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                    placeholder="John Doe"
                                    {...register("name", {
                                        required: "Employee name is required",
                                        minLength: { value: 2, message: "Name must be at least 2 characters" },
                                        pattern: {
                                            value: /^[a-zA-Z\s\-']+$/,
                                            message: "Name can only contain letters, spaces, hyphens and apostrophes"
                                        },
                                        validate: {
                                            notNumeric: v => !/^\d+$/.test(v) || "Name cannot be purely numeric"
                                        }
                                    })}
                                />
                                {errors.name && <span className="form-error">{errors.name.message}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address *</label>
                                <input
                                    type="email"
                                    id="email"
                                    className={`form-input ${errors.email ? 'error' : ''}`}
                                    placeholder="john@example.com"
                                    {...register("email", {
                                        required: "Email address is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Please enter a valid email address"
                                        }
                                    })}
                                />
                                {errors.email && <span className="form-error">{errors.email.message}</span>}
                            </div>

                            {(!isEdit || (isEdit && !fetchingData)) && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="password">
                                            {isEdit ? 'Password (Leave blank to keep current)' : 'Password *'}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            className={`form-input ${errors.password ? 'error' : ''}`}
                                            placeholder={isEdit ? "Set new password" : "Minimum 8 characters"}
                                            {...register("password", {
                                                required: !isEdit ? "Password is required" : false,
                                                minLength: { value: 8, message: "Password must be at least 8 characters" }
                                            })}
                                        />
                                        {errors.password && <span className="form-error">{errors.password.message}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="password_confirmation">Confirm Password {isEdit ? '' : '*'}</label>
                                        <input
                                            type="password"
                                            id="password_confirmation"
                                            className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
                                            placeholder="Re-enter password"
                                            {...register("password_confirmation", {
                                                required: (!isEdit || password) ? "Please confirm your password" : false,
                                                validate: (val) => {
                                                    if (!val && !password) return true;
                                                    if (val !== password) return "Passwords do not match";
                                                }
                                            })}
                                        />
                                        {errors.password_confirmation && <span className="form-error">{errors.password_confirmation.message}</span>}
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="form-label" htmlFor="role">Role *</label>
                                <select
                                    id="role"
                                    className={`form-input ${errors.role ? 'error' : ''}`}
                                    {...register("role", { required: "Please select a role" })}
                                >
                                    <option value="">Select Role</option>
                                    <option value={UserRoleEnum.HR}>HR</option>
                                    <option value={UserRoleEnum.EMPLOYEE}>Employee</option>
                                </select>
                                {errors.role && <span className="form-error">{errors.role.message}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="department">Department</label>
                                <input
                                    type="text"
                                    id="department"
                                    className={`form-input ${errors.department ? 'error' : ''}`}
                                    placeholder="Engineering, HR, Sales, etc."
                                    {...register("department", {
                                        pattern: {
                                            value: /^[a-zA-Z\s]+$/,
                                            message: "Department must contain only letters"
                                        }
                                    })}
                                />
                                {errors.department && <span className="form-error">{errors.department.message}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="status">Status *</label>
                                <select
                                    id="status"
                                    className={`form-input ${errors.status ? 'error' : ''}`}
                                    {...register("status", { required: "Status is required" })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <span className="form-error">{errors.status.message}</span>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting || !isValid}>
                                    <span>{isEdit ? 'Update Employee' : 'Create Employee'}</span>
                                    {isSubmitting && <span className="spinner"></span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeModal;
