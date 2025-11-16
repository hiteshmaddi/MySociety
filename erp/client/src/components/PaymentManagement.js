import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  HStack,
  VStack,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Badge,
  Select
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { paymentsAPI } from '../services/api';
import { format } from 'date-fns';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    villa_no: '',
    amount: '',
    date: '',
    payment_mode: '',
    reference_no: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const from = searchFrom || undefined;
      const to = searchTo || undefined;
      const data = await paymentsAPI.getAll(from, to);
      setPayments(data);
    } catch (error) {
      toast({
        title: 'Error loading payments',
        description: error.response?.data?.error || 'Failed to load payments',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPayments();
  };

  const handleAdd = () => {
    setEditingPayment(null);
    setFormData({
      villa_no: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      payment_mode: '',
      reference_no: ''
    });
    onOpen();
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      villa_no: payment.villa_no || '',
      amount: payment.amount || '',
      date: payment.date || format(new Date(), 'yyyy-MM-dd'),
      payment_mode: payment.payment_mode || '',
      reference_no: payment.reference_no || ''
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingPayment) {
        await paymentsAPI.update(editingPayment.id, formData);
        toast({
          title: 'Payment updated',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      } else {
        await paymentsAPI.create(formData);
        toast({
          title: 'Payment added',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }
      onClose();
      loadPayments();
    } catch (error) {
      toast({
        title: 'Error saving payment',
        description: error.response?.data?.error || 'Failed to save payment',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleDeleteClick = (payment) => {
    setDeletePayment(payment);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      await paymentsAPI.delete(deletePayment.id);
      toast({
        title: 'Payment deleted',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      onDeleteClose();
      loadPayments();
    } catch (error) {
      toast({
        title: 'Error deleting payment',
        description: error.response?.data?.error || 'Failed to delete payment',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            type="date"
            placeholder="From Date"
            value={searchFrom}
            onChange={(e) => setSearchFrom(e.target.value)}
            maxW="200px"
          />
          <Input
            type="date"
            placeholder="To Date"
            value={searchTo}
            onChange={(e) => setSearchTo(e.target.value)}
            maxW="200px"
          />
          <Button onClick={handleSearch} colorScheme="blue">
            Search
          </Button>
          <Button onClick={handleAdd} colorScheme="green" ml="auto">
            Add Payment
          </Button>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple" bg="white">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Villa No</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Payment Mode</Th>
                <Th>Reference No</Th>
                <Th>Created By</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payments.map((payment) => (
                <Tr key={payment.id}>
                  <Td>
                    <Text fontSize="xs" color="gray.500">
                      {payment.id.substring(0, 8)}...
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="purple">{payment.villa_no}</Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme="green" fontSize="md">
                      ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                    </Badge>
                  </Td>
                  <Td>{payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : ''}</Td>
                  <Td>{payment.payment_mode || '-'}</Td>
                  <Td>{payment.reference_no || '-'}</Td>
                  <Td>{payment.created_by}</Td>
                  <Td>
                    {payment.created_at
                      ? format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')
                      : ''}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEdit(payment)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(payment)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {payments.length === 0 && !loading && (
            <Box textAlign="center" py={8} color="gray.500">
              No payments found
            </Box>
          )}
        </Box>
      </VStack>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingPayment ? 'Edit Payment' : 'Add Payment'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Villa No</FormLabel>
                <Input
                  value={formData.villa_no}
                  onChange={(e) => setFormData({ ...formData, villa_no: e.target.value })}
                  placeholder="Enter villa number"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Payment Mode</FormLabel>
                <Select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  placeholder="Select payment mode"
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Reference No</FormLabel>
                <Input
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="Enter reference number (optional)"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Payment
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default PaymentManagement;

